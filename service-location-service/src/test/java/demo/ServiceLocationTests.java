/*
 * Copyright 2015 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package demo;

import static org.junit.Assert.assertEquals;
import static org.springframework.integration.support.management.graph.LinkNode.Type.input;

import org.codehaus.jackson.map.DeserializationConfig;
import org.junit.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.cloud.cloudfoundry.com.fasterxml.jackson.annotation.JsonTypeInfo;
import org.springframework.cloud.cloudfoundry.com.fasterxml.jackson.databind.DeserializationFeature;

import java.util.Hashtable;
import java.util.Map;

/**
 * @author Dave Syer
 *
 */
public class ServiceLocationTests {

	@Test
	public void json() throws Exception {
		ObjectMapper mapper = new ObjectMapper();
		ServiceLocation value = mapper.readValue(mapper.writeValueAsString(new ServiceLocation(52,  0)), ServiceLocation.class);
		assertEquals(52, value.getLatitude(), 0.01);
	}

	@Test
	public void jsonWithId() throws Exception {
		ObjectMapper mapper = new ObjectMapper();
		ServiceLocation input = new ServiceLocation(52.0,  0.0);
		input.setId("102");
		ServiceLocation value = mapper.readValue(mapper.writeValueAsString(input), ServiceLocation.class);
		assertEquals(52.0, value.getLatitude(), 0.01);
		assertEquals("102", value.getId());
	}

	@Test
	public void jsonWithLocation() throws Exception {
		ObjectMapper mapper = new ObjectMapper();
		ServiceLocation input = new ServiceLocation(52.0, 0.0);
		input.setAddress1("Down");
		ServiceLocation value = mapper.readValue(mapper.writeValueAsString(input), ServiceLocation.class);
		assertEquals(52.0, value.getLatitude(), 0.01);
		assertEquals("Down", value.getAddress1());
	}

	@Test
	public void jsonTest() throws Exception {
		ObjectMapper mapper=new ObjectMapper();
		Map<String,String> dt=new Hashtable();
		dt.put("1", "welcome");
		dt.put("2", "bye");
		String jsonString = mapper.writeValueAsString(dt);
		assertEquals("{\"2\":\"bye\",\"1\":\"welcome\"}", jsonString);
	}
}
